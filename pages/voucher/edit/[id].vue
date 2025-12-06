<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { createDefaultVoucherForm, serializeVoucherPayload } from '@/utils/voucher'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const message = useMessage()

const voucherId = computed(() => route.params.id as string)
const form = reactive(createDefaultVoucherForm())
const loading = ref(true)
const saving = ref(false)

const discountTypeOptions = [
  { label: 'Percentage (%)', value: 'percentage' },
  { label: 'Fixed (VND)', value: 'fixed' },
]

const applicableOptions = [
  { label: 'All products', value: 'all' },
  { label: 'Specific medicine', value: 'medicine' },
  { label: 'Specific category', value: 'category' },
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Expired', value: 'expired' },
]

const dateError = computed(() => form.start_date > form.end_date)

watch(
  () => form.discount_type,
  (type) => {
    if (type !== 'percentage') {
      form.max_discount_amount = null
    }
  },
)

function hydrateForm(data: Record<string, any>) {
  form.voucher_code = data.voucher_code || ''
  form.name = data.name || ''
  form.description = data.description || ''
  form.discount_type = data.discount_type || 'percentage'
  form.discount_value = data.discount_value ?? 0
  form.min_purchase_amount = data.min_purchase_amount ?? 0
  form.max_discount_amount = data.max_discount_amount ?? null
  form.usage_limit = data.usage_limit ?? null
  form.usage_limit_per_customer = data.usage_limit_per_customer ?? 1
  form.max_users = data.max_users ?? null
  form.start_date = data.start_date ? new Date(data.start_date).getTime() : Date.now()
  form.end_date = data.end_date ? new Date(data.end_date).getTime() : Date.now()
  form.applicable_to = data.applicable_to || 'all'
  form.status = data.status || 'active'
}

async function fetchVoucher() {
  loading.value = true
  try {
    const res = await api.get(`/api/voucher/${voucherId.value}`)
    if (res.status && res.data) {
      hydrateForm(res.data as Record<string, any>)
    }
    else {
      message.error(res.message || 'Voucher not found')
      router.push('/voucher')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Cannot load voucher')
    router.push('/voucher')
  }
  finally {
    loading.value = false
  }
}

async function updateVoucher() {
  if (dateError.value) {
    message.error('End date must be after (or equal to) start date')
    return
  }

  saving.value = true
  try {
    const payload = serializeVoucherPayload(form)
    const res = await api.put(`/api/voucher/${voucherId.value}`, payload)

    if (res.status) {
      message.success('Voucher updated successfully')
      router.push('/voucher')
    }
    else {
      message.error(res.message || 'Cannot update voucher')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Cannot update voucher')
  }
  finally {
    saving.value = false
  }
}

onMounted(fetchVoucher)
</script>

<template>
  <div>
    <div class="mb-4">
      <n-breadcrumb>
        <n-breadcrumb-item @click="router.push('/voucher')">
          Voucher
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          Edit
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Edit Voucher
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Update time limits, usage count, and users
        </p>
      </div>

      <div class="flex gap-2">
        <Button
          type="button"
          variant="outline"
          @click="router.back()"
        >
          Go Back
        </Button>
        <Button
          type="button"
          :disabled="saving"
          @click="updateVoucher"
        >
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </Button>
      </div>
    </div>

    <n-card>
      <n-spin :show="loading">
        <n-form :model="form" label-placement="top" :disabled="saving || loading">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <n-form-item label="Voucher Code" required>
              <n-input
                v-model:value="form.voucher_code"
                placeholder="E.g: SUMMER2025"
                maxlength="32"
                class="uppercase"
              />
            </n-form-item>

            <n-form-item label="Voucher Name" required>
              <n-input
                v-model:value="form.name"
                placeholder="E.g: Summer promotion"
              />
            </n-form-item>
          </div>

          <n-form-item label="Description">
            <n-input
              v-model:value="form.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 5 }"
              placeholder="Detailed description of application conditions..."
            />
          </n-form-item>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <n-form-item label="Discount Type" required>
              <n-select
                v-model:value="form.discount_type"
                :options="discountTypeOptions"
              />
            </n-form-item>

            <n-form-item :label="`Discount Value (${form.discount_type === 'percentage' ? '%' : 'VND'})`" required>
              <n-input-number
                v-model:value="form.discount_value"
                :min="0"
                class="w-full"
              />
            </n-form-item>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <n-form-item label="Minimum Order (VND)">
              <n-input-number
                v-model:value="form.min_purchase_amount"
                :min="0"
                class="w-full"
              />
            </n-form-item>

            <n-form-item v-if="form.discount_type === 'percentage'" label="Maximum Discount (VND)">
              <n-input-number
                v-model:value="form.max_discount_amount"
                :min="0"
                class="w-full"
              />
            </n-form-item>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <n-form-item label="Total Usage Count">
              <n-input-number
                v-model:value="form.usage_limit"
                :min="1"
                placeholder="Leave blank = unlimited"
                class="w-full"
              />
            </n-form-item>

            <n-form-item label="Uses per Customer">
              <n-input-number
                v-model:value="form.usage_limit_per_customer"
                :min="1"
                class="w-full"
              />
            </n-form-item>

            <n-form-item label="Maximum Number of Customers">
              <n-input-number
                v-model:value="form.max_users"
                :min="1"
                placeholder="Leave blank = unlimited"
                class="w-full"
              />
            </n-form-item>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <n-form-item label="Start Date" required>
              <n-date-picker
                v-model:value="form.start_date"
                type="date"
                class="w-full"
              />
            </n-form-item>

            <n-form-item label="End Date" required>
              <n-date-picker
                v-model:value="form.end_date"
                type="date"
                class="w-full"
              />
            </n-form-item>
          </div>

          <n-alert v-if="dateError" type="error" class="mb-4">
            End date must be equal to or after start date.
          </n-alert>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <n-form-item label="Apply to">
              <n-select
                v-model:value="form.applicable_to"
                :options="applicableOptions"
              />
            </n-form-item>

            <n-form-item label="Status">
              <n-select
                v-model:value="form.status"
                :options="statusOptions"
              />
            </n-form-item>
          </div>
        </n-form>
      </n-spin>
    </n-card>
  </div>
</template>

