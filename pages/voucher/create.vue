<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { api } from '@/utils/api'
import { Button } from '@/components/ui/button'
import { createDefaultVoucherForm, serializeVoucherPayload } from '@/utils/voucher'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const message = useMessage()

const form = reactive(createDefaultVoucherForm())
const submitting = ref(false)

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

async function submitVoucher() {
  if (dateError.value) {
    message.error('End date must be after (or equal to) start date')
    return
  }

  submitting.value = true
  try {
    const payload = serializeVoucherPayload(form)
    const res = await api.post('/api/voucher', payload)

    if (res.status) {
      message.success('Voucher created successfully')
      router.push('/voucher')
    }
    else {
      message.error(res.message || 'Cannot create voucher')
    }
  }
  catch (error: any) {
    message.error(error.message || 'Cannot create voucher')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-4">
      <n-breadcrumb>
        <n-breadcrumb-item @click="router.push('/voucher')">
          Voucher
        </n-breadcrumb-item>
        <n-breadcrumb-item>
          Create
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold">
          Create New Voucher
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Manage time limits, usage count, and number of users
        </p>
      </div>

      <div class="flex gap-2">
        <Button type="button" variant="outline" @click="router.back()">
          Cancel
        </Button>
        <Button type="button" :disabled="submitting" @click="submitVoucher">
          {{ submitting ? 'Saving...' : 'Save Voucher' }}
        </Button>
      </div>
    </div>

    <n-card>
      <n-form :model="form" label-placement="top" :disabled="submitting">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <n-form-item label="Voucher Code" required>
            <n-input v-model:value="form.voucher_code" placeholder="E.g: SUMMER2025" maxlength="32" class="uppercase" />
          </n-form-item>

          <n-form-item label="Voucher Name" required>
            <n-input v-model:value="form.name" placeholder="E.g: Summer promotion" />
          </n-form-item>
        </div>

        <n-form-item label="Description">
          <n-input v-model:value="form.description" type="textarea" :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="Detailed description of application conditions..." />
        </n-form-item>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <n-form-item label="Discount Type" required>
            <n-select v-model:value="form.discount_type" :options="discountTypeOptions" />
          </n-form-item>

          <n-form-item :label="`Discount Value (${form.discount_type === 'percentage' ? '%' : 'VND'})`" required>
            <n-input-number v-model:value="form.discount_value" :min="0" class="w-full" />
          </n-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <n-form-item label="Minimum Order (VND)">
            <n-input-number v-model:value="form.min_purchase_amount" :min="0" class="w-full" />
          </n-form-item>

          <n-form-item v-if="form.discount_type === 'percentage'" label="Maximum Discount (VND)">
            <n-input-number v-model:value="form.max_discount_amount" :min="0" class="w-full" />
          </n-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <n-form-item label="Total Usage Count">
            <n-input-number v-model:value="form.usage_limit" :min="1" placeholder="Leave blank = unlimited"
              class="w-full" />
          </n-form-item>

          <n-form-item label="Uses per Customer" required>
            <n-input-number v-model:value="form.usage_limit_per_customer" :min="1" class="w-full" />
          </n-form-item>

          <n-form-item label="Maximum Number of Customers">
            <n-input-number v-model:value="form.max_users" :min="1" placeholder="Leave blank = unlimited"
              class="w-full" />
          </n-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <n-form-item label="Start Date" required>
            <n-date-picker v-model:value="form.start_date" type="date" class="w-full" />
          </n-form-item>

          <n-form-item label="End Date" required>
            <n-date-picker v-model:value="form.end_date" type="date" class="w-full" />
          </n-form-item>
        </div>

        <n-alert v-if="dateError" type="error" class="mb-4">
          End date must be equal to or after start date.
        </n-alert>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <n-form-item label="Apply to">
            <n-select v-model:value="form.applicable_to" :options="applicableOptions" />
          </n-form-item>

          <n-form-item label="Status">
            <n-select v-model:value="form.status" :options="statusOptions" />
          </n-form-item>
        </div>
      </n-form>
    </n-card>
  </div>
</template>
