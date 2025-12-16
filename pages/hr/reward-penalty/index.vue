<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NTag, NButton, NPopconfirm } from 'naive-ui'
import { h } from 'vue'
import { api } from '@/utils/api'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// State
const loading = ref(false)
const records = ref<any[]>([])
const employees = ref<any[]>([])
const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')
const categoryFilter = ref('all')
const employeeFilter = ref('all')
const monthFilter = ref(new Date().getMonth() + 1)
const yearFilter = ref(new Date().getFullYear())

// Statistics
const stats = ref({
  totalRewards: 0,
  rewardCount: 0,
  totalPenalties: 0,
  penaltyCount: 0,
  netAmount: 0,
  pendingApprovals: 0
})

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const currentRecord = ref<any>({
  employee: '',
  type: 'reward',
  category: '',
  title: '',
  description: '',
  amount: 0,
  effective_date: Date.now(),
  notes: ''
})

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
    fetchRecords()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    fetchRecords()
  },
})

// Reward categories
const rewardCategories = [
  { value: 'performance_bonus', label: 'Performance Bonus' },
  { value: 'attendance_bonus', label: 'Attendance Bonus' },
  { value: 'project_completion', label: 'Project Completion' },
  { value: 'innovation_award', label: 'Innovation Award' },
  { value: 'sales_commission', label: 'Sales Commission' },
  { value: 'referral_bonus', label: 'Referral Bonus' },
  { value: 'annual_bonus', label: 'Annual Bonus' },
  { value: 'holiday_bonus', label: 'Holiday Bonus' },
  { value: 'recognition_award', label: 'Recognition Award' },
  { value: 'overtime_bonus', label: 'Overtime Bonus' },
  { value: 'other_reward', label: 'Other Reward' }
]

// Penalty categories
const penaltyCategories = [
  { value: 'late_arrival', label: 'Late Arrival' },
  { value: 'early_leave', label: 'Early Leave' },
  { value: 'absent_without_leave', label: 'Absent Without Leave' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'performance_issue', label: 'Performance Issue' },
  { value: 'dress_code', label: 'Dress Code Violation' },
  { value: 'safety_violation', label: 'Safety Violation' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'confidentiality_breach', label: 'Confidentiality Breach' },
  { value: 'other_penalty', label: 'Other Penalty' }
]

// Computed categories based on type
const availableCategories = computed(() => {
  if (currentRecord.value.type === 'reward') {
    return rewardCategories
  }
  return penaltyCategories
})

// All categories for filter
const allCategories = computed(() => {
  return [...rewardCategories, ...penaltyCategories]
})

// Fetch employees for dropdown
async function fetchEmployees() {
  try {
    const res = await api.get('/api/hr/employee', { params: { limit: 1000, status: 'active' } })
    if (res.status && res.data) {
      employees.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (error) {
    console.error('Error fetching employees:', error)
  }
}

// Fetch records
async function fetchRecords() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.pageSize,
      month: monthFilter.value,
      year: yearFilter.value
    }

    if (typeFilter.value !== 'all') params.type = typeFilter.value
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    if (categoryFilter.value !== 'all') params.category = categoryFilter.value
    if (employeeFilter.value !== 'all') params.employee = employeeFilter.value
    if (searchQuery.value) params.search = searchQuery.value

    const res = await api.get('/api/hr/reward-penalty', { params })
    if (res.status && res.data) {
      records.value = Array.isArray(res.data) ? res.data : []
      pagination.total = res.total || 0
      pagination.pageCount = Math.ceil(pagination.total / pagination.pageSize)
    } else {
      records.value = []
    }
  } catch (error: any) {
    console.error('Error fetching records:', error)
    message.error(error.message || 'Error loading data')
    records.value = []
  } finally {
    loading.value = false
  }
}

// Fetch statistics
async function fetchStats() {
  try {
    const res = await api.get('/api/hr/reward-penalty/stats', {
      params: { month: monthFilter.value, year: yearFilter.value }
    })
    if (res.status && res.data?.summary) {
      stats.value = res.data.summary
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// Watch filters
watch([typeFilter, statusFilter, categoryFilter, employeeFilter, searchQuery, monthFilter, yearFilter], () => {
  pagination.page = 1
  fetchRecords()
  fetchStats()
})

// Open modal for create
function openCreateModal(type: 'reward' | 'penalty') {
  isEditing.value = false
  currentRecord.value = {
    employee: '',
    type,
    category: '',
    title: '',
    description: '',
    amount: 0,
    effective_date: Date.now(),
    notes: ''
  }
  showModal.value = true
}

// Open modal for edit
function openEditModal(record: any) {
  isEditing.value = true
  currentRecord.value = {
    _id: record._id,
    employee: record.employee?._id || record.employee,
    type: record.type,
    category: record.category,
    title: record.title,
    description: record.description || '',
    amount: record.amount,
    effective_date: new Date(record.effective_date).getTime(),
    notes: record.notes || ''
  }
  showModal.value = true
}

// Save record
async function saveRecord() {
  if (!currentRecord.value.employee) {
    message.error('Please select an employee')
    return
  }
  if (!currentRecord.value.category) {
    message.error('Please select a category')
    return
  }
  if (!currentRecord.value.title) {
    message.error('Please enter a title')
    return
  }
  if (currentRecord.value.amount <= 0) {
    message.error('Amount must be greater than 0')
    return
  }

  loading.value = true
  try {
    const data = {
      ...currentRecord.value,
      effective_date: new Date(currentRecord.value.effective_date)
    }

    let res
    if (isEditing.value) {
      res = await api.put(`/api/hr/reward-penalty/${currentRecord.value._id}`, data)
    } else {
      res = await api.post('/api/hr/reward-penalty', data)
    }

    if (res.status) {
      message.success(res.message || 'Record saved successfully')
      showModal.value = false
      fetchRecords()
      fetchStats()
    } else {
      message.error(res.message || 'Error saving record')
    }
  } catch (error: any) {
    message.error(error.message || 'Error saving record')
  } finally {
    loading.value = false
  }
}

// Delete record
async function deleteRecord(id: string) {
  loading.value = true
  try {
    const res = await api.delete(`/api/hr/reward-penalty/${id}`)
    if (res.status) {
      message.success(res.message || 'Record deleted successfully')
      fetchRecords()
      fetchStats()
    } else {
      message.error(res.message || 'Error deleting record')
    }
  } catch (error: any) {
    message.error(error.message || 'Error deleting record')
  } finally {
    loading.value = false
  }
}

// Approve record
async function approveRecord(id: string, action: 'approve' | 'reject') {
  if (action === 'reject') {
    dialog.warning({
      title: 'Reject Record',
      content: 'Please enter a reason for rejection:',
      positiveText: 'Reject',
      negativeText: 'Cancel',
      onPositiveClick: async () => {
        await doApprove(id, action, 'Rejected by manager')
      }
    })
  } else {
    await doApprove(id, action)
  }
}

async function doApprove(id: string, action: string, rejection_reason?: string) {
  loading.value = true
  try {
    const res = await api.post(`/api/hr/reward-penalty/${id}/approve`, {
      action,
      rejection_reason
    })
    if (res.status) {
      message.success(res.message || `Record ${action}d successfully`)
      fetchRecords()
      fetchStats()
    } else {
      message.error(res.message || `Error ${action}ing record`)
    }
  } catch (error: any) {
    message.error(error.message || `Error ${action}ing record`)
  } finally {
    loading.value = false
  }
}

// Format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Get category label
function getCategoryLabel(category: string) {
  const all = [...rewardCategories, ...penaltyCategories]
  return all.find(c => c.value === category)?.label || category
}

// Columns
const columns: DataTableColumns<any> = [
  {
    title: 'Employee',
    key: 'employee',
    width: 180,
    render: row => h('div', [
      h('div', { class: 'font-medium' }, row.employee?.full_name || 'N/A'),
      h('div', { class: 'text-xs text-gray-500' }, row.employee?.department || '')
    ])
  },
  {
    title: 'Type',
    key: 'type',
    width: 100,
    render: row => h(NTag, {
      type: row.type === 'reward' ? 'success' : 'error',
      round: true
    }, { default: () => row.type === 'reward' ? '🎁 Reward' : '⚠️ Penalty' })
  },
  {
    title: 'Category',
    key: 'category',
    width: 160,
    render: row => getCategoryLabel(row.category)
  },
  {
    title: 'Title',
    key: 'title',
    width: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: 'Amount',
    key: 'amount',
    width: 130,
    render: row => h('span', {
      class: row.type === 'reward' ? 'font-semibold text-green-600' : 'font-semibold text-red-600'
    }, `${row.type === 'reward' ? '+' : '-'}${formatCurrency(row.amount)}`)
  },
  {
    title: 'Date',
    key: 'effective_date',
    width: 110,
    render: row => new Date(row.effective_date).toLocaleDateString('vi-VN')
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    render: row => {
      const statusMap: Record<string, any> = {
        pending: { type: 'warning', label: 'Pending' },
        approved: { type: 'success', label: 'Approved' },
        rejected: { type: 'error', label: 'Rejected' },
        applied: { type: 'info', label: 'Applied' }
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type, round: true, size: 'small' }, { default: () => status.label })
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 200,
    render: row => {
      const buttons = []
      
      if (row.status === 'pending') {
        buttons.push(
          h(NButton, {
            size: 'small',
            type: 'success',
            class: 'mr-1',
            onClick: () => approveRecord(row._id, 'approve')
          }, { default: () => '✓' }),
          h(NButton, {
            size: 'small',
            type: 'error',
            class: 'mr-1',
            onClick: () => approveRecord(row._id, 'reject')
          }, { default: () => '✗' })
        )
      }

      if (row.status !== 'applied') {
        buttons.push(
          h(NButton, {
            size: 'small',
            type: 'info',
            class: 'mr-1',
            onClick: () => openEditModal(row)
          }, { default: () => '✏️' }),
          h(NPopconfirm, {
            onPositiveClick: () => deleteRecord(row._id)
          }, {
            trigger: () => h(NButton, { size: 'small', type: 'error' }, { default: () => '🗑️' }),
            default: () => 'Are you sure to delete?'
          })
        )
      }

      return h('div', { class: 'flex gap-1' }, buttons)
    }
  }
]

// Month options
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Month ${i + 1}`,
  value: i + 1
}))

// Year options
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  label: `${currentYear - 2 + i}`,
  value: currentYear - 2 + i
}))

onMounted(() => {
  fetchEmployees()
  fetchRecords()
  fetchStats()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Rewards & Penalties
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Manage employee rewards and penalties
        </p>
      </div>

      <div class="flex gap-2">
        <n-button @click="openCreateModal('reward')">
          🎁 Add Reward
        </n-button>
        <n-button @click="openCreateModal('penalty')">
          ⚠️ Add Penalty
        </n-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ formatCurrency(stats.totalRewards) }}</div>
          <div class="text-sm text-gray-500">Total Rewards ({{ stats.rewardCount }})</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-red-600">{{ formatCurrency(stats.totalPenalties) }}</div>
          <div class="text-sm text-gray-500">Total Penalties ({{ stats.penaltyCount }})</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold" :class="stats.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'">
            {{ formatCurrency(stats.netAmount) }}
          </div>
          <div class="text-sm text-gray-500">Net Amount</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-yellow-600">{{ stats.pendingApprovals }}</div>
          <div class="text-sm text-gray-500">Pending Approvals</div>
        </div>
      </n-card>
    </div>

    <!-- Filters -->
    <n-card class="mb-4">
      <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <n-select v-model:value="monthFilter" :options="monthOptions" placeholder="Month" />
        <n-select v-model:value="yearFilter" :options="yearOptions" placeholder="Year" />
        <n-select 
          v-model:value="employeeFilter" 
          :options="[
            { label: 'All Employees', value: 'all' },
            ...employees.map(e => ({ label: e.full_name, value: e._id }))
          ]" 
          placeholder="Employee"
          filterable
        />
        <n-select 
          v-model:value="typeFilter" 
          :options="[
            { label: 'All Types', value: 'all' },
            { label: '🎁 Rewards', value: 'reward' },
            { label: '⚠️ Penalties', value: 'penalty' }
          ]" 
          placeholder="Type"
        />
        <n-select 
          v-model:value="statusFilter" 
          :options="[
            { label: 'All Status', value: 'all' },
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Applied', value: 'applied' }
          ]" 
          placeholder="Status"
        />
        <n-input v-model:value="searchQuery" placeholder="Search..." clearable />
      </div>
    </n-card>

    <!-- Data Table -->
    <n-card title="Reward & Penalty Records">
      <n-data-table 
        :columns="columns" 
        :data="records" 
        :loading="loading" 
        :row-key="(row: any) => row._id"
        :pagination="pagination"
      />
    </n-card>

    <!-- Create/Edit Modal -->
    <n-modal v-model:show="showModal" preset="card" :title="isEditing ? 'Edit Record' : (currentRecord.type === 'reward' ? 'Add Reward' : 'Add Penalty')" style="width: 600px;">
      <n-form>
        <n-form-item label="Employee" required>
          <n-select 
            v-model:value="currentRecord.employee" 
            :options="employees.map(e => ({ label: `${e.full_name} - ${e.department}`, value: e._id }))"
            placeholder="Select employee"
            filterable
          />
        </n-form-item>

        <n-form-item label="Type" required>
          <n-radio-group v-model:value="currentRecord.type" :disabled="isEditing">
            <n-radio-button value="reward">🎁 Reward</n-radio-button>
            <n-radio-button value="penalty">⚠️ Penalty</n-radio-button>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="Category" required>
          <n-select 
            v-model:value="currentRecord.category" 
            :options="availableCategories"
            placeholder="Select category"
          />
        </n-form-item>

        <n-form-item label="Title" required>
          <n-input v-model:value="currentRecord.title" placeholder="Enter title" />
        </n-form-item>

        <n-form-item label="Amount (VND)" required>
          <n-input-number 
            v-model:value="currentRecord.amount" 
            :min="0" 
            :step="100000"
            style="width: 100%"
            :format="(value: number) => value?.toLocaleString('vi-VN')"
          />
        </n-form-item>

        <n-form-item label="Effective Date" required>
          <n-date-picker v-model:value="currentRecord.effective_date" type="date" style="width: 100%" />
        </n-form-item>

        <n-form-item label="Description">
          <n-input v-model:value="currentRecord.description" type="textarea" placeholder="Enter description" />
        </n-form-item>

        <n-form-item label="Notes">
          <n-input v-model:value="currentRecord.notes" type="textarea" placeholder="Additional notes" />
        </n-form-item>

        <div class="flex justify-end gap-2 mt-4">
          <n-button @click="showModal = false">Cancel</n-button>
          <n-button :loading="loading" @click="saveRecord">
            {{ isEditing ? 'Update' : 'Create' }}
          </n-button>
        </div>
      </n-form>
    </n-modal>
  </div>
</template>
