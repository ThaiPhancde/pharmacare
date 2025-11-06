<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NTag, NButton, NStatistic, NCard, NGi, NGrid } from 'naive-ui'
import { h } from 'vue'
import { api } from '@/utils/api'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const loading = ref(false)
const shiftData = ref<any>(null)
const showClosingDialog = ref(false)

const closingForm = ref({
  opening_balance: 0,
  actual_balance: 0,
  notes: '',
})

const filters = ref({
  employee: '',
  date: new Date().toISOString().split('T')[0],
  shift_id: '',
})

const employees = ref<any[]>([])

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

async function loadShiftReport() {
  if (!filters.value.employee && !filters.value.shift_id) {
    message.warning('Vui lòng chọn nhân viên và ngày hoặc nhập shift ID')
    return
  }

  loading.value = true
  try {
    const params: any = {}
    if (filters.value.shift_id) {
      params.shift_id = filters.value.shift_id
    }
    else {
      params.employee = filters.value.employee
      params.date = filters.value.date
    }

    const res = await api.get('/api/report/shift-closing', { params })

    if (res.status) {
      shiftData.value = res.data
    }
    else {
      message.error(res.message)
      shiftData.value = null
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi tải báo cáo ca')
    shiftData.value = null
  }
  finally {
    loading.value = false
  }
}

function openClosingDialog() {
  closingForm.value = {
    opening_balance: 0,
    actual_balance: 0,
    notes: '',
  }
  showClosingDialog.value = true
}

async function handleCloseShift() {
  if (!shiftData.value) {
    message.error('Không có dữ liệu ca làm việc')
    return
  }

  loading.value = true
  try {
    const res = await api.post('/api/report/shift-closing/close', {
      shift_id: shiftData.value.shift._id,
      opening_balance: closingForm.value.opening_balance,
      actual_balance: closingForm.value.actual_balance,
      notes: closingForm.value.notes,
      summary: shiftData.value.summary,
    })

    if (res.status) {
      message.success(res.message)
      showClosingDialog.value = false
      loadShiftReport()
    }
    else {
      message.error(res.message)
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi kết ca')
  }
  finally {
    loading.value = false
  }
}

const invoiceColumns: DataTableColumns<any> = [
  {
    title: 'Số HĐ',
    key: 'invoice_number',
    width: 120,
  },
  {
    title: 'Khách hàng',
    key: 'customer',
    render: row => row.customer?.name || 'Khách lẻ',
  },
  {
    title: 'Tổng tiền',
    key: 'total_amount',
    render: row => new Intl.NumberFormat('vi-VN').format(row.total_amount) + ' đ',
  },
  {
    title: 'Giảm giá',
    key: 'discount',
    render: row => new Intl.NumberFormat('vi-VN').format(row.discount || 0) + ' đ',
  },
  {
    title: 'Thanh toán',
    key: 'payment_method',
    render: (row) => {
      const methodMap: Record<string, any> = {
        cash: { type: 'success', label: 'Tiền mặt' },
        card: { type: 'info', label: 'Thẻ' },
        transfer: { type: 'warning', label: 'Chuyển khoản' },
      }
      const method = methodMap[row.payment_method] || { type: 'default', label: row.payment_method }
      return h(NTag, { type: method.type, size: 'small' }, { default: () => method.label })
    },
  },
  {
    title: 'Thời gian',
    key: 'createdAt',
    render: row => new Date(row.createdAt).toLocaleString('vi-VN'),
  },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
}

onMounted(() => {
  fetchEmployees()
})
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="text-2xl font-bold">
        Báo cáo kết ca
      </h1>
      <p class="text-gray-500 dark:text-gray-400">
        Xem doanh thu và kết toán cuối ca làm việc
      </p>
    </div>

    <!-- Filters -->
    <n-card title="Tìm kiếm ca làm việc" class="mb-4">
      <n-form label-placement="left" label-width="120">
        <div class="grid grid-cols-3 gap-4">
          <n-form-item label="Nhân viên">
            <n-select
              v-model:value="filters.employee"
              :options="employees.map((e: any) => ({ label: e.name, value: e._id }))"
              placeholder="Chọn nhân viên"
              clearable
            />
          </n-form-item>

          <n-form-item label="Ngày">
            <n-date-picker
              v-model:formatted-value="filters.date"
              type="date"
              value-format="yyyy-MM-dd"
              class="w-full"
            />
          </n-form-item>

          <n-form-item label="Hoặc Shift ID">
            <n-input v-model:value="filters.shift_id" placeholder="Nhập Shift ID" clearable />
          </n-form-item>
        </div>

        <div class="flex justify-end">
          <n-button type="primary" @click="loadShiftReport" :loading="loading">
            🔍 Xem báo cáo
          </n-button>
        </div>
      </n-form>
    </n-card>

    <!-- Report Content -->
    <div v-if="shiftData">
      <!-- Shift Info -->
      <n-card title="Thông tin ca làm việc" class="mb-4">
        <n-grid :cols="4" :x-gap="12">
          <n-gi>
            <div class="text-sm text-gray-500">
              Nhân viên
            </div>
            <div class="font-bold">
              {{ shiftData.shift.employee.name }}
            </div>
          </n-gi>
          <n-gi>
            <div class="text-sm text-gray-500">
              Ca làm việc
            </div>
            <div class="font-bold">
              {{ shiftData.shift.shift_type }}
            </div>
          </n-gi>
          <n-gi>
            <div class="text-sm text-gray-500">
              Giờ làm
            </div>
            <div class="font-bold">
              {{ shiftData.shift.start_time }} - {{ shiftData.shift.end_time }}
            </div>
          </n-gi>
          <n-gi>
            <div class="text-sm text-gray-500">
              Trạng thái
            </div>
            <n-tag :type="shiftData.shift.status === 'completed' ? 'success' : 'info'">
              {{ shiftData.shift.status === 'completed' ? 'Đã kết ca' : 'Đang làm' }}
            </n-tag>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- Summary Statistics -->
      <n-card title="Tổng quan doanh thu" class="mb-4">
        <n-grid :cols="4" :x-gap="12">
          <n-gi>
            <n-statistic label="Tổng hóa đơn" :value="shiftData.summary.total_invoices" />
          </n-gi>
          <n-gi>
            <n-statistic label="Tổng doanh thu" :value="formatCurrency(shiftData.summary.total_revenue)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Tổng giảm giá" :value="formatCurrency(shiftData.summary.total_discount)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Doanh thu thuần" :value="formatCurrency(shiftData.summary.net_revenue)" />
          </n-gi>
        </n-grid>

        <n-divider />

        <n-grid :cols="3" :x-gap="12">
          <n-gi>
            <n-statistic label="Tiền mặt" :value="formatCurrency(shiftData.summary.total_cash)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Thẻ" :value="formatCurrency(shiftData.summary.total_card)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Chuyển khoản" :value="formatCurrency(shiftData.summary.total_transfer)" />
          </n-gi>
        </n-grid>
      </n-card>

      <!-- Invoice List -->
      <n-card title="Danh sách hóa đơn" class="mb-4">
        <n-data-table
          :columns="invoiceColumns"
          :data="shiftData.invoices"
          :row-key="(row: any) => row._id"
        />
      </n-card>

      <!-- Close Shift Button -->
      <div v-if="shiftData.shift.status !== 'completed'" class="flex justify-end">
        <n-button type="primary" size="large" @click="openClosingDialog">
          💰 Kết toán ca
        </n-button>
      </div>
    </div>

    <!-- Empty State -->
    <n-card v-else-if="!loading" class="text-center py-8">
      <p class="text-gray-500">
        Chọn nhân viên và ngày để xem báo cáo ca làm việc
      </p>
    </n-card>

    <!-- Closing Dialog -->
    <n-modal v-model:show="showClosingDialog" preset="card" title="Kết toán ca" style="max-width: 500px">
      <n-form :model="closingForm" label-placement="top">
        <n-form-item label="Số dư đầu ca (VNĐ)">
          <n-input-number v-model:value="closingForm.opening_balance" :min="0" class="w-full" />
        </n-form-item>

        <n-form-item label="Số dư thực tế cuối ca (VNĐ)" required>
          <n-input-number v-model:value="closingForm.actual_balance" :min="0" class="w-full" />
        </n-form-item>

        <n-alert v-if="shiftData" type="info" class="mb-4">
          <template #header>
            Thông tin dự kiến
          </template>
          <div>Số dư đầu ca: {{ formatCurrency(closingForm.opening_balance) }}</div>
          <div>Tiền mặt trong ca: {{ formatCurrency(shiftData.summary.total_cash) }}</div>
          <div>Số dư dự kiến: {{ formatCurrency(closingForm.opening_balance + shiftData.summary.total_cash) }}</div>
          <div class="font-bold mt-2">
            Chênh lệch: {{ formatCurrency(closingForm.actual_balance - (closingForm.opening_balance + shiftData.summary.total_cash)) }}
          </div>
        </n-alert>

        <n-form-item label="Ghi chú">
          <n-input v-model:value="closingForm.notes" type="textarea" :rows="3" placeholder="Ghi chú về kết ca..." />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showClosingDialog = false">
            Hủy
          </n-button>
          <n-button type="primary" :loading="loading" @click="handleCloseShift">
            Xác nhận kết ca
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
