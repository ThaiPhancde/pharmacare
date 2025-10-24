<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NTag } from 'naive-ui'
import { h } from 'vue'
import { api } from '@/utils/api'

definePageMeta({
  layout: 'default',
})

const message = useMessage()

// State
const loading = ref(false)
const invoices = ref<any[]>([])
const startDate = ref<number | null>(null)
const endDate = ref<number | null>(null)
const summary = ref<any>(null)

// Fetch sales report
async function fetchReport() {
  loading.value = true
  try {
    const params: any = {}
    if (startDate.value)
      params.start_date = new Date(startDate.value).toISOString()
    if (endDate.value)
      params.end_date = new Date(endDate.value).toISOString()

    const res = await api.get('/api/report/sales', { params })
    if (res.status) {
      invoices.value = res.data || []
      summary.value = res.summary
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi tải báo cáo')
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
  }).format(amount)
}

// Format date
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN')
}

// Columns
const columns: DataTableColumns<any> = [
  {
    title: 'Số HĐ',
    key: 'invoice_no',
    width: 120,
  },
  {
    title: 'Ngày',
    key: 'date',
    width: 120,
    render: row => formatDate(row.date),
  },
  {
    title: 'Khách hàng',
    key: 'customer',
    render: row => row.customer?.name || 'Khách vãng lai',
  },
  {
    title: 'Tổng tiền',
    key: 'grand_total',
    width: 150,
    render: row => formatCurrency(row.grand_total),
  },
  {
    title: 'Đã trả',
    key: 'paid',
    width: 150,
    render: row => formatCurrency(row.paid),
  },
  {
    title: 'Còn nợ',
    key: 'due',
    width: 150,
    render: row => h('span', { class: row.due > 0 ? 'text-red-600 font-semibold' : '' }, formatCurrency(row.due)),
  },
  {
    title: 'PT Thanh toán',
    key: 'payment_method',
    width: 130,
    render: row => h(NTag, { type: 'info', size: 'small' }, { default: () => row.payment_method }),
  },
]

onMounted(fetchReport)
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Sales Report
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Sales revenue and invoice statistics
        </p>
      </div>
    </div>

    <!-- Filters -->
    <n-card class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <n-date-picker
          v-model:value="startDate"
          type="date"
          placeholder="From date"
          clearable
        />
        <n-date-picker
          v-model:value="endDate"
          type="date"
          placeholder="To date"
          clearable
        />
        <n-button type="primary" @click="fetchReport">
          🔍 Search
        </n-button>
      </div>
    </n-card>

    <!-- Summary -->
    <div v-if="summary" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <n-card>
        <n-statistic label="Total Sales" :value="summary.total_sales">
          <template #suffix>
            đ
          </template>
        </n-statistic>
      </n-card>
      <n-card>
        <n-statistic label="Total Paid" :value="summary.total_paid">
          <template #suffix>
            đ
          </template>
        </n-statistic>
      </n-card>
      <n-card>
        <n-statistic label="Total Due" :value="summary.total_due">
          <template #suffix>
            đ
          </template>
        </n-statistic>
      </n-card>
      <n-card>
        <n-statistic label="Total Invoices" :value="summary.total_invoices" />
      </n-card>
    </div>

    <!-- Table -->
    <n-card title="Invoice Details">
      <n-data-table
        :columns="columns"
        :data="invoices"
        :loading="loading"
        :row-key="(row: any) => row._id"
      />
    </n-card>
  </div>
</template>
