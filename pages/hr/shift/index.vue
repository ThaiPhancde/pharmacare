<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NTag, NButton } from 'naive-ui'
import { h } from 'vue'
import { api } from '@/utils/api'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const loading = ref(false)
const shifts = ref<any[]>([])
const showDialog = ref(false)
const selectedShift = ref<any>(null)
const employees = ref<any[]>([])

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
    if (res.status) {
      shifts.value = res.data || []
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi tải danh sách ca làm việc')
  }
  finally {
    loading.value = false
  }
}

async function fetchEmployees() {
  try {
    const res = await api.get('/api/hr/employee')
    if (res.status) {
      employees.value = res.data || []
    }
  }
  catch (error: any) {
    console.error('Error loading employees:', error)
  }
}

function openCreateDialog() {
  selectedShift.value = null
  formData.value = {
    employee: '',
    shift_date: '',
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
  loading.value = true
  try {
    const url = selectedShift.value
      ? `/api/hr/shift/${selectedShift.value._id}`
      : '/api/hr/shift'
    const method = selectedShift.value ? 'PUT' : 'POST'

    const res = await api[method.toLowerCase() as 'put' | 'post'](url, formData.value)

    if (res.status) {
      message.success(res.message)
      showDialog.value = false
      fetchShifts()
    }
    else {
      message.error(res.message || 'Lỗi khi lưu ca làm việc')
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
  if (!window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này?'))
    return

  loading.value = true
  try {
    const res = await api.delete(`/api/hr/shift/${id}`)
    if (res.status) {
      message.success(res.message)
      fetchShifts()
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi xóa ca làm việc')
  }
  finally {
    loading.value = false
  }
}

const columns: DataTableColumns<any> = [
  {
    title: 'Nhân viên',
    key: 'employee',
    render: row => row.employee?.name || 'N/A',
  },
  {
    title: 'Ngày',
    key: 'shift_date',
    render: row => new Date(row.shift_date).toLocaleDateString('vi-VN'),
  },
  {
    title: 'Ca làm việc',
    key: 'shift_type',
    render: (row) => {
      const typeMap: Record<string, string> = {
        'morning': 'Sáng',
        'afternoon': 'Chiều',
        'evening': 'Tối',
        'night': 'Đêm',
        'full-day': 'Cả ngày',
      }
      return typeMap[row.shift_type] || row.shift_type
    },
  },
  {
    title: 'Giờ làm',
    key: 'time',
    render: row => `${row.start_time} - ${row.end_time}`,
  },
  {
    title: 'Số giờ',
    key: 'hours',
    render: row => `${row.hours_worked}h${row.overtime_hours > 0 ? ` (+${row.overtime_hours}h)` : ''}`,
  },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (row) => {
      const statusMap: Record<string, any> = {
        'scheduled': { type: 'info', label: 'Đã lên lịch' },
        'completed': { type: 'success', label: 'Hoàn thành' },
        'absent': { type: 'error', label: 'Vắng mặt' },
        'cancelled': { type: 'warning', label: 'Đã hủy' },
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type, round: true }, { default: () => status.label })
    },
  },
  {
    title: 'Hành động',
    key: 'actions',
    width: 120,
    render: row => h('div', { class: 'flex gap-2' }, [
      h(NButton, {
        size: 'small',
        onClick: () => openEditDialog(row),
      }, { default: () => '✏️' }),
      h(NButton, {
        size: 'small',
        type: 'error',
        onClick: () => deleteShift(row._id),
      }, { default: () => '🗑️' }),
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
          Quản lý ca làm việc
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Lên lịch và theo dõi ca làm việc của nhân viên
        </p>
      </div>

      <n-button type="primary" @click="openCreateDialog">
        ➕ Tạo ca làm việc
      </n-button>
    </div>

    <n-card title="Danh sách ca làm việc">
      <n-data-table
        :columns="columns"
        :data="shifts"
        :loading="loading"
        :row-key="(row: any) => row._id"
      />
    </n-card>

    <!-- Dialog -->
    <n-modal v-model:show="showDialog" preset="card" :title="selectedShift ? 'Chỉnh sửa ca' : 'Tạo ca mới'" style="max-width: 600px">
      <n-form :model="formData" label-placement="top">
        <n-form-item label="Nhân viên" required>
          <n-select
            v-model:value="formData.employee"
            :options="employees.map((e: any) => ({ label: e.name, value: e._id }))"
            placeholder="Chọn nhân viên"
          />
        </n-form-item>

        <n-form-item label="Ngày làm việc" required>
          <n-date-picker
            v-model:formatted-value="formData.shift_date"
            type="date"
            value-format="yyyy-MM-dd"
            class="w-full"
          />
        </n-form-item>

        <n-form-item label="Loại ca" required>
          <n-select
            v-model:value="formData.shift_type"
            :options="[
              { label: 'Sáng', value: 'morning' },
              { label: 'Chiều', value: 'afternoon' },
              { label: 'Tối', value: 'evening' },
              { label: 'Đêm', value: 'night' },
              { label: 'Cả ngày', value: 'full-day' },
            ]"
          />
        </n-form-item>

        <div class="grid grid-cols-2 gap-4">
          <n-form-item label="Giờ bắt đầu">
            <n-input v-model:value="formData.start_time" type="time" />
          </n-form-item>

          <n-form-item label="Giờ kết thúc">
            <n-input v-model:value="formData.end_time" type="time" />
          </n-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <n-form-item label="Số giờ làm">
            <n-input-number v-model:value="formData.hours_worked" :min="0" class="w-full" />
          </n-form-item>

          <n-form-item label="Giờ tăng ca">
            <n-input-number v-model:value="formData.overtime_hours" :min="0" class="w-full" />
          </n-form-item>
        </div>

        <n-form-item label="Trạng thái">
          <n-select
            v-model:value="formData.status"
            :options="[
              { label: 'Đã lên lịch', value: 'scheduled' },
              { label: 'Hoàn thành', value: 'completed' },
              { label: 'Vắng mặt', value: 'absent' },
              { label: 'Đã hủy', value: 'cancelled' },
            ]"
          />
        </n-form-item>

        <n-form-item label="Ghi chú">
          <n-input v-model:value="formData.notes" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showDialog = false">
            Hủy
          </n-button>
          <n-button type="primary" :loading="loading" @click="handleSubmit">
            Lưu
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
