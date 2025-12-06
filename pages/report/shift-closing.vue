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
const showEmployeeSelector = ref(false)
const selectedEmployeeForReport = ref<string>('')

async function fetchEmployees() {
  try {
    const res = await api.get('/api/hr/employee', { params: { status: 'active', limit: 100 } })
    if (res.status && res.data) {
      employees.value = Array.isArray(res.data) ? res.data : []
    } else {
      employees.value = []
    }
  }
  catch (error: any) {
    console.error('Error loading employees:', error)
    employees.value = []
  }
}

function openEmployeeSelector() {
  showEmployeeSelector.value = true
}

function viewOtherEmployeeReport() {
  if (!selectedEmployeeForReport.value) {
    message.warning('Please select an employee')
    return
  }

  const selectedEmp = employees.value.find((e: any) => e._id === selectedEmployeeForReport.value)
  if (selectedEmp) {
    filters.value.employee = selectedEmployeeForReport.value
    filters.value.shift_id = ''
    loadShiftReport()
    showEmployeeSelector.value = false
    selectedEmployeeForReport.value = ''
  }
}

async function loadShiftReport() {
  if (!filters.value.employee && !filters.value.shift_id) {
    message.warning('Please select employee and date or enter shift ID')
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
    message.error(error.message || 'Error loading shift report')
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
    message.error('No shift data available')
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
    message.error(error.message || 'Error closing shift')
  }
  finally {
    loading.value = false
  }
}

const invoiceColumns: DataTableColumns<any> = [
  {
    title: 'Invoice No.',
    key: 'invoice_no',
    width: 150,
    render: row => h('span', { class: 'font-mono text-blue-600' }, row.invoice_no || row._id),
  },
  {
    title: 'Customer',
    key: 'customer',
    render: row => row.customer?.full_name || row.customer?.name || 'Walk-in',
  },
  {
    title: 'Total Amount',
    key: 'grand_total',
    render: row => h('span', { class: 'font-semibold text-green-600' }, formatCurrency(row.grand_total || 0)),
  },
  {
    title: 'Discount',
    key: 'discount',
    render: row => h('span', { class: 'text-orange-600' }, formatCurrency(row.discount || 0)),
  },
  {
    title: 'Payment Method',
    key: 'payment_method',
    render: (row) => {
      const methodMap: Record<string, any> = {
        cash: { type: 'success', label: 'Cash' },
        card: { type: 'info', label: 'Card' },
        bank: { type: 'warning', label: 'Bank Transfer' },
        momo: { type: 'error', label: 'MoMo' },
      }
      const method = methodMap[row.payment_method] || { type: 'default', label: row.payment_method }
      return h(NTag, { type: method.type, size: 'small', round: true }, { default: () => method.label })
    },
  },
  {
    title: 'Paid',
    key: 'paid',
    render: row => h('span', { class: 'font-medium' }, formatCurrency(row.paid || 0)),
  },
  {
    title: 'Time',
    key: 'createdAt',
    width: 180,
    render: row => new Date(row.createdAt).toLocaleString('en-US'),
  },
]

// Tính tổng hợp sản phẩm đã bán
const soldProducts = computed(() => {
  if (!shiftData.value || !shiftData.value.invoices) return []

  const productMap = new Map()

  shiftData.value.invoices.forEach((invoice: any) => {
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item: any) => {
        const productName = item.medicine_name || item.medicine?.name || 'N/A'
        const key = `${item.medicine || item.medicine_id || productName}`

        if (productMap.has(key)) {
          const existing = productMap.get(key)
          existing.quantity += item.quantity || 0
          existing.total += (item.subtotal || item.price * item.quantity || 0)
        } else {
          productMap.set(key, {
            medicine_name: productName,
            medicine_id: item.medicine || item.medicine_id,
            quantity: item.quantity || 0,
            unit_price: item.price || 0,
            total: item.subtotal || (item.price * item.quantity || 0),
          })
        }
      })
    }
  })

  return Array.from(productMap.values()).sort((a, b) => b.total - a.total)
})

const productColumns: DataTableColumns<any> = [
  {
    title: 'Product Name',
    key: 'medicine_name',
    render: row => h('span', { class: 'font-medium' }, row.medicine_name),
  },
  {
    title: 'Quantity',
    key: 'quantity',
    width: 120,
    render: row => h('span', { class: 'text-center' }, row.quantity),
  },
  {
    title: 'Unit Price',
    key: 'unit_price',
    width: 150,
    render: row => h('span', { class: 'text-gray-600' }, formatCurrency(row.unit_price)),
  },
  {
    title: 'Amount',
    key: 'total',
    width: 150,
    render: row => h('span', { class: 'font-semibold text-green-600' }, formatCurrency(row.total)),
  },
]

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

onMounted(() => {
  fetchEmployees()
})
</script>

<template>
  <div>
    <div class="mb-4 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">
          Shift Closing Report
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          View revenue and final settlement of work shift
        </p>
      </div>
      <n-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold"
        @click="openEmployeeSelector">
        👥 View Other Employee Report
      </n-button>
    </div>

    <!-- Filters -->
    <n-card title="Search Shift" class="mb-4">
      <n-form label-placement="left" label-width="120">
        <div class="grid grid-cols-3 gap-4">
          <n-form-item label="Employee">
            <n-select v-model:value="filters.employee"
              :options="employees.map((e: any) => ({ label: e.full_name || e.name || e._id, value: e._id }))"
              placeholder="Select employee" clearable filterable />
          </n-form-item>

          <n-form-item label="Date">
            <n-date-picker v-model:formatted-value="filters.date" type="date" value-format="yyyy-MM-dd"
              class="w-full" />
          </n-form-item>

          <n-form-item label="Or Shift ID">
            <n-input v-model:value="filters.shift_id" placeholder="Enter Shift ID" clearable />
          </n-form-item>
        </div>

        <div class="flex justify-end">
          <n-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold"
            @click="loadShiftReport" :loading="loading">
            🔍 View Report
          </n-button>
        </div>
      </n-form>
    </n-card>

    <!-- Report Content -->
    <div v-if="shiftData">
      <!-- Shift Info -->
      <n-card title="Shift Information" class="mb-4">
        <n-grid :cols="4" :x-gap="12">
          <n-gi>
            <div class="text-sm text-gray-500">
              Employee
            </div>
            <div class="font-bold">
              {{ shiftData.shift.employee?.full_name || shiftData.shift.employee?.name || 'N/A' }}
            </div>
          </n-gi>
          <n-gi>
            <div class="text-sm text-gray-500">
              Shift Type
            </div>
            <div class="font-bold">
              {{ getShiftTypeLabel(shiftData.shift.shift_type) }}
            </div>
          </n-gi>
          <n-gi>
            <div class="text-sm text-gray-500">
              Working Hours
            </div>
            <div class="font-bold">
              {{ shiftData.shift.start_time }} - {{ shiftData.shift.end_time }}
            </div>
          </n-gi>
          <n-gi>
            <div class="text-sm text-gray-500">
              Status
            </div>
            <n-tag :type="shiftData.shift.status === 'completed' ? 'success' : 'info'">
              {{ shiftData.shift.status === 'completed' ? 'Completed' : 'Active' }}
            </n-tag>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- Summary Statistics -->
      <n-card title="Revenue Overview" class="mb-4">
        <n-grid :cols="5" :x-gap="12">
          <n-gi>
            <n-statistic label="Total Invoices" :value="shiftData.summary.total_invoices" />
          </n-gi>
          <n-gi>
            <n-statistic label="Total Revenue" :value="formatCurrency(shiftData.summary.total_revenue)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Total VAT" :value="formatCurrency(shiftData.summary.total_vat || 0)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Total Discount" :value="formatCurrency(shiftData.summary.total_discount)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Net Revenue" :value="formatCurrency(shiftData.summary.net_revenue)" />
          </n-gi>
        </n-grid>

        <n-divider />

        <n-grid :cols="4" :x-gap="12">
          <n-gi>
            <n-statistic label="Cash" :value="formatCurrency(shiftData.summary.total_cash)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Card" :value="formatCurrency(shiftData.summary.total_card)" />
          </n-gi>
          <n-gi>
            <n-statistic label="Bank Transfer" :value="formatCurrency(shiftData.summary.total_bank)" />
          </n-gi>
          <n-gi>
            <n-statistic label="MoMo" :value="formatCurrency(shiftData.summary.total_momo || 0)" />
          </n-gi>
        </n-grid>

        <n-divider />

        <!-- Cash Reconciliation -->
        <n-card title="Cash Reconciliation" class="mt-4">
          <n-grid :cols="4" :x-gap="12">
            <n-gi>
              <n-statistic label="Opening Balance" :value="formatCurrency(shiftData.summary.opening_balance || 0)" />
            </n-gi>
            <n-gi>
              <n-statistic label="Cash Received" :value="formatCurrency(shiftData.summary.total_cash)" />
            </n-gi>
            <n-gi>
              <n-statistic label="Expected Balance" :value="formatCurrency(shiftData.summary.expected_cash || 0)" />
            </n-gi>
            <n-gi>
              <n-statistic label="Actual Balance" :value="formatCurrency(shiftData.summary.closing_balance || 0)" />
            </n-gi>
          </n-grid>
          <n-divider />
          <div class="flex justify-center">
            <n-statistic :label="`Difference: ${shiftData.summary.cash_difference >= 0 ? 'Surplus' : 'Shortage'}`"
              :value="formatCurrency(Math.abs(shiftData.summary.cash_difference || 0))"
              :value-style="{ color: shiftData.summary.cash_difference >= 0 ? '#18a058' : '#d03050' }" />
          </div>
        </n-card>
      </n-card>

      <!-- Sold Products -->
      <n-card title="Products Sold in Shift" class="mb-4">
        <div v-if="soldProducts.length === 0" class="text-center py-4 text-gray-500">
          No products were sold in this shift
        </div>
        <n-data-table v-else :columns="productColumns" :data="soldProducts"
          :row-key="(row: any) => row.medicine_id || row.medicine_name" />
      </n-card>

      <!-- Invoice List -->
      <n-card title="Invoice List" class="mb-4">
        <n-data-table :columns="invoiceColumns" :data="shiftData.invoices" :row-key="(row: any) => row._id" />
      </n-card>

      <!-- Close Shift Button -->
      <div v-if="shiftData.shift.status !== 'completed'" class="flex justify-end">
        <n-button type="primary" size="large" @click="openClosingDialog">
          💰 Close Shift
        </n-button>
      </div>
    </div>

    <!-- Empty State -->
    <n-card v-else-if="!loading" class="text-center py-8">
      <p class="text-gray-500">
        Select employee and date to view shift report
      </p>
    </n-card>

    <!-- Closing Dialog -->
    <n-modal v-model:show="showClosingDialog" preset="card" title="Close Shift" style="max-width: 500px">
      <n-form :model="closingForm" label-placement="top">
        <n-form-item label="Opening Balance (VND)">
          <n-input-number v-model:value="closingForm.opening_balance" :min="0" class="w-full" />
        </n-form-item>

        <n-form-item label="Actual Closing Balance (VND)" required>
          <n-input-number v-model:value="closingForm.actual_balance" :min="0" class="w-full" />
        </n-form-item>

        <n-alert v-if="shiftData" type="info" class="mb-4">
          <template #header>
            Expected Information
          </template>
          <div>Opening Balance: {{ formatCurrency(closingForm.opening_balance) }}</div>
          <div>Cash in Shift: {{ formatCurrency(shiftData.summary.total_cash) }}</div>
          <div>Expected Balance: {{ formatCurrency(closingForm.opening_balance + shiftData.summary.total_cash) }}</div>
          <div class="font-bold mt-2">
            Difference: {{ formatCurrency(closingForm.actual_balance - (closingForm.opening_balance +
              shiftData.summary.total_cash)) }}
          </div>
        </n-alert>

        <n-form-item label="Notes">
          <n-input v-model:value="closingForm.notes" type="textarea" :rows="3"
            placeholder="Notes about shift closing..." />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showClosingDialog = false">
            Cancel
          </n-button>
          <n-button type="primary" :loading="loading" @click="handleCloseShift">
            Confirm Close Shift
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- Employee Selector Modal -->
    <n-modal v-model:show="showEmployeeSelector" preset="card" title="Select Employee to View Report"
      style="max-width: 500px">
      <n-form :model="{ employee: selectedEmployeeForReport }" label-placement="top">
        <n-form-item label="Select Employee" required>
          <n-select v-model:value="selectedEmployeeForReport" :options="employees.map((e: any) => ({
            label: e.full_name || e.name || e._id,
            value: e._id
          }))" placeholder="Select employee" filterable clearable class="w-full" />
        </n-form-item>
        <n-alert type="info" class="mb-4">
          After selecting an employee, please select a date and click "View Report" to view that employee's report.
        </n-alert>
      </n-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showEmployeeSelector = false">
            Cancel
          </n-button>
          <n-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold"
            @click="viewOtherEmployeeReport">
            View Report
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
