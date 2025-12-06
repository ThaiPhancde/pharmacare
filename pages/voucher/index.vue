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

// State
const loading = ref(false)
const vouchers = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')

// Fetch vouchers
async function fetchVouchers() {
  loading.value = true
  try {
    const res = await api.get('/api/voucher')
    if (res.status) {
      vouchers.value = res.data || []
    }
  }
  catch (error: any) {
    message.error(error.message || 'Error loading voucher list')
  }
  finally {
    loading.value = false
  }
}

// Filtered vouchers
const filteredVouchers = computed(() => {
  let result = vouchers.value

  if (statusFilter.value !== 'all') {
    result = result.filter((v: any) => v.status === statusFilter.value)
  }

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    result = result.filter((v: any) =>
      v.voucher_code.toLowerCase().includes(search)
      || v.name.toLowerCase().includes(search),
    )
  }

  return result
})

// Delete voucher
async function deleteVoucher(id: string) {
  if (!window.confirm('Are you sure you want to delete this voucher?'))
    return

  loading.value = true
  try {
    const res = await api.delete(`/api/voucher/${id}`)
    if (res.status) {
      message.success(res.message)
      fetchVouchers()
    }
    else {
      message.error(res.message || 'Error deleting voucher')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Error deleting voucher')
  }
  finally {
    loading.value = false
  }
}

// Format functions
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN')
}

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
    title: 'Voucher Code',
    key: 'voucher_code',
    width: 150,
    render: (row) => h('span', { class: 'font-mono font-bold text-green-600' }, row.voucher_code),
  },
  {
    title: 'Name',
    key: 'name',
    render: (row) => h('div', [
      h('div', { class: 'font-medium' }, row.name),
      h('div', { class: 'text-sm text-gray-500' }, row.description),
    ]),
  },
  {
    title: 'Discount',
    key: 'discount',
    width: 120,
    render: (row) => {
      if (row.discount_type === 'percentage') {
        return h('span', { class: 'text-orange-600 font-semibold' }, `${row.discount_value}%`)
      }
      return h('span', { class: 'text-orange-600 font-semibold' }, formatCurrency(row.discount_value))
    },
  },
  {
    title: 'Usage',
    key: 'usage',
    width: 100,
    render: (row) =>
      h('div', [
        h('div', `${row.usage_count} / ${row.usage_limit || '∞'}`),
        h(
          'div',
          { class: 'text-xs text-gray-500' },
          `KH: ${row.usage_limit_per_customer || 1}${row.max_users ? ` • Người: ${row.max_users}` : ''}`,
        ),
      ]),
  },
  {
    title: 'Validity',
    key: 'validity',
    width: 150,
    render: (row) => h('div', [
      h('div', formatDate(row.start_date)),
      h('div', { class: 'text-sm text-gray-500' }, formatDate(row.end_date)),
    ]),
  },
  {
    title: 'Status',
    key: 'status',
    width: 120,
    render: (row) => {
      const statusMap: Record<string, any> = {
        'active': { type: 'success', label: 'Active' },
        'inactive': { type: 'default', label: 'Inactive' },
        'expired': { type: 'error', label: 'Expired' },
      }
      const status = statusMap[row.status] || { type: 'default', label: row.status }
      return h(NTag, { type: status.type, round: true }, { default: () => status.label })
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    render: (row) => h('div', { class: 'flex gap-2' }, [
      h('button', {
        class: 'text-blue-600 hover:text-blue-800',
        onClick: () => router.push(`/voucher/edit/${row._id}`),
      }, '✏️'),
      h('button', {
        class: 'text-red-600 hover:text-red-800',
        onClick: () => deleteVoucher(row._id),
      }, '🗑️'),
    ]),
  },
]

onMounted(fetchVouchers)
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Voucher Management
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Manage discount codes and promotions
        </p>
      </div>

      <Button @click="router.push('/voucher/create')">
        ➕ Create Voucher
      </Button>
    </div>

    <!-- Filters -->
    <n-card class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <n-input
          v-model:value="searchQuery"
          placeholder="Search by code or name..."
          clearable
        />
        <n-select
          v-model:value="statusFilter"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Expired', value: 'expired' },
          ]"
        />
      </div>
    </n-card>

    <!-- Vouchers Table -->
    <n-card title="Voucher List">
      <n-data-table
        :columns="columns"
        :data="filteredVouchers"
        :loading="loading"
        :row-key="(row: any) => row._id"
      />
    </n-card>
  </div>
</template>
