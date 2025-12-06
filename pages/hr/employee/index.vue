<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NTag } from 'naive-ui'
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
const employees = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')
const departmentFilter = ref('all')

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
    fetchEmployees()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    fetchEmployees()
  },
})

// Fetch employees
async function fetchEmployees() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.pageSize,
    }

    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }

    if (departmentFilter.value !== 'all') {
      params.department = departmentFilter.value
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const res = await api.get('/api/hr/employee', { params })
    if (res.status && res.data) {
      employees.value = Array.isArray(res.data) ? res.data : []
      pagination.total = res.total || 0
      pagination.pageCount = Math.ceil(pagination.total / pagination.pageSize)
    } else {
      employees.value = []
      pagination.total = 0
      pagination.pageCount = 1
    }
  }
  catch (error: any) {
    console.error('Error fetching employees:', error)
    message.error(error.message || 'Error loading employee list')
    employees.value = []
    pagination.total = 0
    pagination.pageCount = 1
  }
  finally {
    loading.value = false
  }
}

// Watch filters and search to reset to page 1
watch([statusFilter, departmentFilter, searchQuery], () => {
  pagination.page = 1
  fetchEmployees()
})

// Get unique departments
const departments = computed(() => {
  return [...new Set(employees.value.map(e => e.department))]
})

// Delete employee
async function deleteEmployee(id: string) {
  dialog.warning({
    title: 'Delete Employee',
    content: 'Are you sure you want to delete this employee? This action cannot be undone.',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    positiveButtonProps: {
      type: 'error',
      class: '!bg-red-600 !text-white hover:!bg-red-700',
    },
    negativeButtonProps: {
      type: 'default',
    },
    onPositiveClick: async () => {
      loading.value = true
      try {
        const res = await api.delete(`/api/hr/employee/${id}`)
        if (res.status) {
          message.success(res.message || 'Employee deleted successfully')
          fetchEmployees()
        }
        else {
          message.error(res.message || 'Error deleting employee')
        }
      }
      catch (error: any) {
        message.error(error.message || 'Error deleting employee')
      }
      finally {
        loading.value = false
      }
    },
  })
}

// Format functions
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Columns
const columns: DataTableColumns<any> = [
  {
    title: 'Full Name',
    key: 'full_name',
    render: row => h('div', [
      h('div', { class: 'font-medium' }, row.full_name),
      h('div', { class: 'text-sm text-gray-500' }, row.email),
    ]),
  },
  {
    title: 'Designation',
    key: 'designation',
    width: 150,
  },
  {
    title: 'Department',
    key: 'department',
    width: 150,
  },
  {
    title: 'Contact',
    key: 'phone',
    width: 130,
    render: row => row.phone || 'N/A',
  },
  {
    title: 'Basic Salary',
    key: 'salary_basic',
    width: 150,
    render: row => h('span', { class: 'font-semibold text-green-600' }, formatCurrency(row.salary_basic)),
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    render: row => {
      const statusMap: Record<string, any> = {
        active: { type: 'success', label: 'Active' },
        'on-leave': { type: 'warning', label: 'On Leave' },
        inactive: { type: 'default', label: 'Inactive' },
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type, round: true }, { default: () => status.label })
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 150,
    render: row => h('div', { class: 'flex gap-2' }, [
      h('button', {
        class: 'text-blue-600 hover:text-blue-800',
        onClick: () => router.push(`/hr/employee/${row._id}`),
      }, '👁️'),
      h('button', {
        class: 'text-green-600 hover:text-green-800',
        onClick: () => router.push(`/hr/employee/edit/${row._id}`),
      }, '✏️'),
      h('button', {
        class: 'text-red-600 hover:text-red-800',
        onClick: () => deleteEmployee(row._id),
      }, '🗑️'),
    ]),
  },
]

onMounted(fetchEmployees)
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Employee Management
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Employee list and information
        </p>
      </div>

      <n-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold"
        @click="router.push('/hr/employee/create')">
        ➕ Add Employee
      </n-button>
    </div>

    <!-- Filters -->
    <n-card class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <n-input v-model:value="searchQuery" placeholder="Name, email..." clearable />
        <n-select v-model:value="departmentFilter" :options="[
          { label: 'All', value: 'all' },
          ...departments.map(d => ({ label: d, value: d })),
        ]" />
        <n-select v-model:value="statusFilter" :options="[
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'On Leave', value: 'on-leave' },
          { label: 'Inactive', value: 'inactive' },
        ]" />
      </div>
    </n-card>

    <!-- Employees Table -->
    <n-card title="Employee List">
      <n-data-table :columns="columns" :data="employees" :loading="loading" :row-key="(row: any) => row._id"
        :pagination="pagination" />
    </n-card>
  </div>
</template>
