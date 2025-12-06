<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NTag, NButton } from 'naive-ui'
import { h } from 'vue'
import { api } from '@/utils/api'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const loading = ref(false)
const shifts = ref<any[]>([])
const showDialog = ref(false)
const selectedShift = ref<any>(null)
const employees = ref<any[]>([])
const startingShiftId = ref<string | null>(null)
const endingShiftId = ref<string | null>(null)

const formData = ref({
  employee: '',
  shift_date: '',
  shift_type: 'morning',
  start_time: '08:00',
  end_time: '17:00',
  hours_worked: 8,
  overtime_hours: 0,
  status: 'scheduled',
  notes: '',
})

async function fetchShifts() {
  loading.value = true
  try {
    const res = await api.get('/api/hr/shift')
    if (res.status && res.data) {
      const data = res.data as any
      shifts.value = Array.isArray(data) ? data : []
    } else {
      shifts.value = []
    }
  }
  catch (error: any) {
    message.error(error.message || 'Error loading shift list')
    shifts.value = []
  }
  finally {
    loading.value = false
  }
}

async function fetchEmployees() {
  try {
    const res = await api.get('/api/hr/employee', { params: { status: 'active' } })
    if (res.status && res.data) {
      const data = res.data as any
      employees.value = Array.isArray(data) ? data : []
    } else {
      employees.value = []
    }
  }
  catch (error: any) {
    console.error('Error loading employees:', error)
    employees.value = []
    message.warning('Unable to load employee list. Please try again.')
  }
}

function openCreateDialog() {
  selectedShift.value = null
  formData.value = {
    employee: '',
    shift_date: null as any,
    shift_type: 'morning',
    start_time: '08:00',
    end_time: '17:00',
    hours_worked: 8,
    overtime_hours: 0,
    status: 'scheduled',
    notes: '',
  }
  showDialog.value = true
}

function openEditDialog(shift: any) {
  selectedShift.value = shift
  formData.value = {
    employee: shift.employee._id,
    shift_date: new Date(shift.shift_date).toISOString().split('T')[0],
    shift_type: shift.shift_type,
    start_time: shift.start_time,
    end_time: shift.end_time,
    hours_worked: shift.hours_worked,
    overtime_hours: shift.overtime_hours,
    status: shift.status,
    notes: shift.notes || '',
  }
  showDialog.value = true
}

async function handleSubmit() {
  // Validation
  if (!formData.value.employee) {
    message.error('Please select an employee')
    return
  }
  if (!formData.value.shift_date) {
    message.error('Please select a work date')
    return
  }

  loading.value = true
  try {
    const url = selectedShift.value
      ? `/api/hr/shift/${selectedShift.value._id}`
      : '/api/hr/shift'
    const method = selectedShift.value ? 'PUT' : 'POST'

    // Prepare data for submission
    const submitData = {
      ...formData.value,
      shift_date: formData.value.shift_date || null,
    }

    const res = await api[method.toLowerCase() as 'put' | 'post'](url, submitData)

    if (res.status) {
      message.success(res.message)
      showDialog.value = false
      fetchShifts()
    }
    else {
      message.error(res.message || 'Error saving shift')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi lưu ca làm việc')
  }
  finally {
    loading.value = false
  }
}

async function deleteShift(id: string) {
  dialog.warning({
    title: 'Delete Shift',
    content: 'Are you sure you want to delete this shift?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
    positiveButtonProps: {
      type: 'error',
      class: '!bg-red-600 !text-white hover:!bg-red-700',
    },
    onPositiveClick: async () => {
      loading.value = true
      try {
        const res = await api.delete(`/api/hr/shift/${id}`)
        if (res.status) {
          message.success(res.message)
          fetchShifts()
        }
      }
      catch (error: any) {
        message.error(error.message || 'Error deleting shift')
      }
      finally {
        loading.value = false
      }
    },
  })
}

async function startShift(id: string) {
  startingShiftId.value = id
  try {
    const res = await api.post('/api/hr/shift/start-shift', {
      shift_id: id,
      opening_balance: 0,
    })
    if (res.status) {
      message.success('Shift started successfully')
      fetchShifts()
    }
    else {
      message.error(res.message || 'Error starting shift')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi bắt đầu ca')
  }
  finally {
    startingShiftId.value = null
  }
}

const showEndShiftDialog = ref(false)
const selectedShiftForEnd = ref<any>(null)
const endShiftForm = ref({
  closing_balance: 0,
  notes: '',
})

async function endShift(id: string) {
  const shift = shifts.value.find(s => s._id === id)
  if (!shift) {
    message.error('Shift not found')
    return
  }

  selectedShiftForEnd.value = shift
  endShiftForm.value = {
    closing_balance: shift.closing_balance || 0,
    notes: shift.notes || '',
  }
  showEndShiftDialog.value = true
}

async function handleEndShift() {
  if (!selectedShiftForEnd.value) return

  endingShiftId.value = selectedShiftForEnd.value._id
  try {
    const res = await api.post('/api/hr/shift/end-shift', {
      shift_id: selectedShiftForEnd.value._id,
      closing_balance: endShiftForm.value.closing_balance,
      notes: endShiftForm.value.notes,
    })
    if (res.status) {
      message.success('Shift ended successfully')
      showEndShiftDialog.value = false
      fetchShifts()
    }
    else {
      message.error(res.message || 'Error ending shift')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi kết thúc ca')
  }
  finally {
    endingShiftId.value = null
  }
}

function viewShiftReport(shiftId: string) {
  router.push(`/report/shift-closing?shift_id=${shiftId}`)
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

function getShiftTypeLabel(type: string) {
  const typeMap: Record<string, string> = {
    'morning': 'Morning',
    'afternoon': 'Afternoon',
    'evening': 'Evening',
    'night': 'Night',
    'full-day': 'Full Day',
  }
  return typeMap[type] || type
}

const columns: DataTableColumns<any> = [
  {
    title: 'Employee',
    key: 'employee',
    render: row => row.employee?.full_name || row.employee?.name || 'N/A',
  },
  {
    title: 'Date',
    key: 'shift_date',
    render: row => new Date(row.shift_date).toLocaleDateString('en-US'),
  },
  {
    title: 'Shift Type',
    key: 'shift_type',
    render: (row) => {
      const typeMap: Record<string, string> = {
        'morning': 'Morning',
        'afternoon': 'Afternoon',
        'evening': 'Evening',
        'night': 'Night',
        'full-day': 'Full Day',
      }
      return typeMap[row.shift_type] || row.shift_type
    },
  },
  {
    title: 'Working Hours',
    key: 'time',
    render: row => `${row.start_time} - ${row.end_time}`,
  },
  {
    title: 'Hours',
    key: 'hours',
    render: row => `${row.hours_worked}h${row.overtime_hours > 0 ? ` (+${row.overtime_hours}h)` : ''}`,
  },
  {
    title: 'Status',
    key: 'status',
    render: (row) => {
      const statusMap: Record<string, any> = {
        'scheduled': { type: 'info', label: 'Scheduled' },
        'active': { type: 'success', label: 'Active' },
        'completed': { type: 'default', label: 'Completed' },
        'absent': { type: 'error', label: 'Absent' },
        'cancelled': { type: 'warning', label: 'Cancelled' },
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type, round: true }, { default: () => status.label })
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 350,
    render: row => h('div', { class: 'flex gap-2 flex-wrap' }, [
      // Start/End shift button
      row.status === 'scheduled'
        ? h(NButton, {
          size: 'small',
          type: 'success',
          class: '!bg-green-600 hover:!bg-green-700 text-white font-semibold',
          onClick: () => startShift(row._id),
          loading: startingShiftId.value === row._id,
        }, { default: () => '▶️ Start' })
        : row.status === 'active'
          ? h(NButton, {
            size: 'small',
            type: 'warning',
            class: '!bg-orange-500 hover:!bg-orange-600 text-white font-semibold',
            onClick: () => endShift(row._id),
            loading: endingShiftId.value === row._id,
          }, { default: () => '⏹️ End' })
          : null,
      // View Report button - available for all shifts (even if no data yet)
      h(NButton, {
        size: 'small',
        type: 'primary',
        class: '!bg-blue-600 hover:!bg-blue-700 text-white font-semibold',
        onClick: () => viewShiftReport(row._id),
      }, { default: () => '📊 Report' }),
      h(NButton, {
        size: 'small',
        onClick: () => openEditDialog(row),
      }, { default: () => '✏️ Edit' }),
      h(NButton, {
        size: 'small',
        type: 'error',
        class: '!bg-red-600 hover:!bg-red-700 text-white font-semibold',
        onClick: () => deleteShift(row._id),
        disabled: row.status === 'active',
      }, { default: () => '🗑️ Delete' }),
    ]),
  },
]

onMounted(() => {
  fetchShifts()
  fetchEmployees()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Shift Management
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Schedule and track employee shifts
        </p>
      </div>

      <div class="flex gap-2">
        <n-button @click="router.push('/hr/employee/create')"
          class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold" type="primary">
          👤 Add Employee
        </n-button>
        <n-button type="primary" class="!bg-green-600 hover:!bg-green-700 text-white font-semibold"
          @click="openCreateDialog">
          ➕ Create Shift
        </n-button>
      </div>
    </div>

    <!-- Info Alert -->
    <n-alert v-if="employees.length === 0" type="warning" class="mb-4" closable>
      <template #header>
        No Employees
      </template>
      <div>
        You need to add employees before creating shifts.
        <n-button size="small" type="primary" class="!bg-green-600 hover:!bg-green-700 text-white font-semibold"
          @click="router.push('/hr/employee/create')">
          Add Employee Now
        </n-button>
      </div>
    </n-alert>

    <n-card title="Shift List">
      <n-data-table :columns="columns" :data="shifts" :loading="loading" :row-key="(row: any) => row._id" />
    </n-card>

    <!-- Dialog -->
    <n-modal v-model:show="showDialog" preset="card" :title="selectedShift ? 'Edit Shift' : 'Create New Shift'"
      style="max-width: 600px" :mask-closable="false">
      <n-form :model="formData" label-placement="top">
        <n-form-item label="Employee" required>
          <div class="flex gap-2">
            <n-select v-model:value="formData.employee"
              :options="employees.map((e: any) => ({ label: e.full_name || e.name || e._id, value: e._id }))"
              placeholder="Select employee" filterable class="flex-1" />
            <n-button @click="router.push('/hr/employee/create')" type="primary" ghost>
              ➕ Add Employee
            </n-button>
          </div>
          <template #feedback>
            <div v-if="employees.length === 0" class="text-amber-600 text-xs mt-1">
              ⚠️ No employees available. Please add employees first.
            </div>
          </template>
        </n-form-item>

        <n-form-item label="Work Date" required>
          <n-date-picker v-model:formatted-value="formData.shift_date" type="date" value-format="yyyy-MM-dd"
            format="yyyy-MM-dd" class="w-full" clearable :default-value="formData.shift_date || null" />
        </n-form-item>

        <n-form-item label="Shift Type" required>
          <n-select v-model:value="formData.shift_type" :options="[
            { label: 'Morning', value: 'morning' },
            { label: 'Afternoon', value: 'afternoon' },
            { label: 'Evening', value: 'evening' },
            { label: 'Night', value: 'night' },
            { label: 'Full Day', value: 'full-day' },
          ]" />
        </n-form-item>

        <div class="grid grid-cols-2 gap-4">
          <n-form-item label="Start Time">
            <n-time-picker v-model:formatted-value="formData.start_time" format="HH:mm" value-format="HH:mm"
              class="w-full" />
          </n-form-item>

          <n-form-item label="End Time">
            <n-time-picker v-model:formatted-value="formData.end_time" format="HH:mm" value-format="HH:mm"
              class="w-full" />
          </n-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <n-form-item label="Hours Worked">
            <n-input-number v-model:value="formData.hours_worked" :min="0" class="w-full" />
          </n-form-item>

          <n-form-item label="Overtime Hours">
            <n-input-number v-model:value="formData.overtime_hours" :min="0" class="w-full" />
          </n-form-item>
        </div>

        <n-form-item label="Status">
          <n-select v-model:value="formData.status" :options="[
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Completed', value: 'completed' },
            { label: 'Absent', value: 'absent' },
            { label: 'Cancelled', value: 'cancelled' },
          ]" />
        </n-form-item>

        <n-form-item label="Notes">
          <n-input v-model:value="formData.notes" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showDialog = false">
            Cancel
          </n-button>
          <n-button type="primary" :loading="loading" @click="handleSubmit"
            class="!bg-green-600 hover:!bg-green-700 text-white font-semibold">
            Save
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- End Shift Dialog -->
    <n-modal v-model:show="showEndShiftDialog" preset="card" title="End Shift" style="max-width: 600px">
      <div v-if="selectedShiftForEnd">
        <n-alert type="info" class="mb-4">
          <template #header>
            Shift Information
          </template>
          <div class="space-y-1 text-sm">
            <div><strong>Employee:</strong> {{ selectedShiftForEnd.employee?.full_name ||
              selectedShiftForEnd.employee?.name || 'N/A' }}</div>
            <div><strong>Date:</strong> {{ new Date(selectedShiftForEnd.shift_date).toLocaleDateString('en-US') }}</div>
            <div><strong>Shift:</strong> {{ getShiftTypeLabel(selectedShiftForEnd.shift_type) }}</div>
            <div><strong>Time:</strong> {{ selectedShiftForEnd.start_time }} - {{ selectedShiftForEnd.end_time }}</div>
            <div v-if="selectedShiftForEnd.opening_balance !== undefined">
              <strong>Opening Balance:</strong> {{ formatCurrency(selectedShiftForEnd.opening_balance) }}
            </div>
          </div>
        </n-alert>

        <n-form :model="endShiftForm" label-placement="top">
          <n-form-item label="Closing Balance (VND)" required>
            <n-input-number v-model:value="endShiftForm.closing_balance" :min="0"
              :formatter="(value: number | null) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
              :parser="(value: string) => value ? value.replace(/,/g, '') : '0'" class="w-full"
              placeholder="Enter closing balance" />
            <template #feedback>
              <span class="text-xs text-gray-500">Actual cash amount in register at end of shift</span>
            </template>
          </n-form-item>

          <n-form-item label="Notes">
            <n-input v-model:value="endShiftForm.notes" type="textarea" :rows="3"
              placeholder="Notes about the shift (if any)" />
          </n-form-item>
        </n-form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showEndShiftDialog = false">
            Cancel
          </n-button>
          <n-button type="warning" :loading="endingShiftId === selectedShiftForEnd?._id" @click="handleEndShift"
            class="!bg-orange-500 hover:!bg-orange-600 text-white font-semibold">
            End Shift
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
