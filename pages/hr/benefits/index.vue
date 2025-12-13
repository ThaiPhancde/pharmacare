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
const benefits = ref<any[]>([])
const showDialog = ref(false)
const selectedBenefit = ref<any>(null)
const employees = ref<any[]>([])

const formData = ref({
  employee: '',
  benefit_type: 'insurance',
  benefit_name: '',
  description: '',
  amount: 0,
  effective_date: '',
  expiry_date: '',
  status: 'active',
  payment_frequency: 'one-time',
  notes: '',
})

async function fetchBenefits() {
  loading.value = true
  try {
    const res = await api.get('/api/hr/benefits')
    if (res.status) {
      benefits.value = res.data || []
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi tải danh sách phúc lợi')
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
  selectedBenefit.value = null
  formData.value = {
    employee: '',
    benefit_type: 'insurance',
    benefit_name: '',
    description: '',
    amount: 0,
    effective_date: '',
    expiry_date: '',
    status: 'active',
    payment_frequency: 'one-time',
    notes: '',
  }
  showDialog.value = true
}

function openEditDialog(benefit: any) {
  selectedBenefit.value = benefit
  formData.value = {
    employee: benefit.employee._id,
    benefit_type: benefit.benefit_type,
    benefit_name: benefit.benefit_name,
    description: benefit.description || '',
    amount: benefit.amount,
    effective_date: new Date(benefit.effective_date).toISOString().split('T')[0],
    expiry_date: benefit.expiry_date ? new Date(benefit.expiry_date).toISOString().split('T')[0] : '',
    status: benefit.status,
    payment_frequency: benefit.payment_frequency,
    notes: benefit.notes || '',
  }
  showDialog.value = true
}

async function handleSubmit() {
  loading.value = true
  try {
    const url = selectedBenefit.value
      ? `/api/hr/benefits/${selectedBenefit.value._id}`
      : '/api/hr/benefits'
    const method = selectedBenefit.value ? 'PUT' : 'POST'

    const res = await api[method.toLowerCase() as 'put' | 'post'](url, formData.value)

    if (res.status) {
      const isEditMode = selectedBenefit.value !== null
      message.success(res.message)
      showDialog.value = false
      fetchBenefits()
      
      // Chỉ reset khi ADD, không reset khi UPDATE
      if (!isEditMode) {
        selectedBenefit.value = null
        formData.value = {
          employee: null,
          benefit_type: 'insurance',
          amount: 0,
          effective_date: new Date().toISOString().split('T')[0],
          notes: '',
        }
      }
    }
    else {
      message.error(res.message || 'Lỗi khi lưu phúc lợi')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi lưu phúc lợi')
  }
  finally {
    loading.value = false
  }
}

async function deleteBenefit(id: string) {
  if (!window.confirm('Bạn có chắc chắn muốn xóa phúc lợi này?'))
    return

  loading.value = true
  try {
    const res = await api.delete(`/api/hr/benefits/${id}`)
    if (res.status) {
      message.success(res.message)
      fetchBenefits()
    }
  }
  catch (error: any) {
    message.error(error.message || 'Lỗi khi xóa phúc lợi')
  }
  finally {
    loading.value = false
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

const columns: DataTableColumns<any> = [
  {
    title: 'Nhân viên',
    key: 'employee',
    render: row => row.employee?.name || 'N/A',
  },
  {
    title: 'Loại phúc lợi',
    key: 'benefit_type',
    render: (row) => {
      const typeMap: Record<string, string> = {
        'insurance': 'Bảo hiểm',
        'bonus': 'Thưởng',
        'allowance': 'Phụ cấp',
        'training': 'Đào tạo',
        'welfare': 'Phúc lợi',
        'other': 'Khác',
      }
      return typeMap[row.benefit_type] || row.benefit_type
    },
  },
  {
    title: 'Tên phúc lợi',
    key: 'benefit_name',
  },
  {
    title: 'Số tiền',
    key: 'amount',
    render: row => formatCurrency(row.amount),
  },
  {
    title: 'Tần suất',
    key: 'payment_frequency',
    render: (row) => {
      const freqMap: Record<string, string> = {
        'one-time': 'Một lần',
        'monthly': 'Hàng tháng',
        'quarterly': 'Hàng quý',
        'yearly': 'Hàng năm',
      }
      return freqMap[row.payment_frequency] || row.payment_frequency
    },
  },
  {
    title: 'Ngày hiệu lực',
    key: 'effective_date',
    render: row => new Date(row.effective_date).toLocaleDateString('vi-VN'),
  },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (row) => {
      const statusMap: Record<string, any> = {
        active: { type: 'success', label: 'Hoạt động' },
        inactive: { type: 'warning', label: 'Ngưng' },
        expired: { type: 'error', label: 'Hết hạn' },
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
        onClick: () => deleteBenefit(row._id),
      }, { default: () => '🗑️' }),
    ]),
  },
]

onMounted(() => {
  fetchBenefits()
  fetchEmployees()
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Quản lý phúc lợi nhân viên
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Theo dõi và quản lý các khoản phúc lợi
        </p>
      </div>

      <n-button type="primary" @click="openCreateDialog">
        ➕ Tạo phúc lợi
      </n-button>
    </div>

    <n-card title="Danh sách phúc lợi">
      <n-data-table
        :columns="columns"
        :data="benefits"
        :loading="loading"
        :row-key="(row: any) => row._id"
      />
    </n-card>

    <!-- Dialog -->
    <n-modal v-model:show="showDialog" preset="card" :title="selectedBenefit ? 'Chỉnh sửa phúc lợi' : 'Tạo phúc lợi mới'" style="max-width: 600px">
      <n-form :model="formData" label-placement="top">
        <n-form-item label="Nhân viên" required>
          <n-select
            v-model:value="formData.employee"
            :options="employees.map((e: any) => ({ label: e.name, value: e._id }))"
            placeholder="Chọn nhân viên"
          />
        </n-form-item>

        <n-form-item label="Loại phúc lợi" required>
          <n-select
            v-model:value="formData.benefit_type"
            :options="[
              { label: 'Bảo hiểm', value: 'insurance' },
              { label: 'Thưởng', value: 'bonus' },
              { label: 'Phụ cấp', value: 'allowance' },
              { label: 'Đào tạo', value: 'training' },
              { label: 'Phúc lợi', value: 'welfare' },
              { label: 'Khác', value: 'other' },
            ]"
          />
        </n-form-item>

        <n-form-item label="Tên phúc lợi" required>
          <n-input v-model:value="formData.benefit_name" placeholder="VD: Bảo hiểm sức khỏe" />
        </n-form-item>

        <n-form-item label="Mô tả">
          <n-input v-model:value="formData.description" type="textarea" :rows="2" />
        </n-form-item>

        <div class="grid grid-cols-2 gap-4">
          <n-form-item label="Số tiền (VNĐ)" required>
            <n-input-number v-model:value="formData.amount" :min="0" class="w-full" />
          </n-form-item>

          <n-form-item label="Tần suất chi trả">
            <n-select
              v-model:value="formData.payment_frequency"
              :options="[
                { label: 'Một lần', value: 'one-time' },
                { label: 'Hàng tháng', value: 'monthly' },
                { label: 'Hàng quý', value: 'quarterly' },
                { label: 'Hàng năm', value: 'yearly' },
              ]"
            />
          </n-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <n-form-item label="Ngày hiệu lực" required>
            <n-date-picker
              v-model:formatted-value="formData.effective_date"
              type="date"
              value-format="yyyy-MM-dd"
              class="w-full"
            />
          </n-form-item>

          <n-form-item label="Ngày hết hạn">
            <n-date-picker
              v-model:formatted-value="formData.expiry_date"
              type="date"
              value-format="yyyy-MM-dd"
              class="w-full"
            />
          </n-form-item>
        </div>

        <n-form-item label="Trạng thái">
          <n-select
            v-model:value="formData.status"
            :options="[
              { label: 'Hoạt động', value: 'active' },
              { label: 'Ngưng', value: 'inactive' },
              { label: 'Hết hạn', value: 'expired' },
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
