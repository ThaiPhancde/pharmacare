<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { useMessage } from '@/composables/useMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface VoucherForm {
  voucher_code: string
  name: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount?: number
  max_discount_amount?: number
  usage_limit?: number
  usage_limit_per_customer?: number
  max_users?: number
  start_date: string
  end_date: string
  applicable_to: 'all' | 'medicine' | 'category'
  status: 'active' | 'inactive'
}

const props = defineProps<{
  open: boolean
  editData?: any
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'success'): void
}>()

const { showSuccess, showError } = useMessage()
const loading = ref(false)

const formData = ref<VoucherForm>({
  voucher_code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  min_purchase_amount: 0,
  max_discount_amount: undefined,
  usage_limit: undefined,
  usage_limit_per_customer: 1,
  max_users: undefined,
  start_date: '',
  end_date: '',
  applicable_to: 'all',
  status: 'active',
})

function resetForm() {
  formData.value = {
    voucher_code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: undefined,
    usage_limit: undefined,
    usage_limit_per_customer: 1,
    max_users: undefined,
    start_date: '',
    end_date: '',
    applicable_to: 'all',
    status: 'active',
  }
}

async function handleSubmit() {
  loading.value = true
  try {
    const response = await useApi('/api/voucher', {
      method: props.editData ? 'PUT' : 'POST',
      body: formData.value,
    })

    if (response.status) {
      showSuccess(response.message)
      emit('success')
      emit('update:open', false)
      resetForm()
    }
    else {
      showError(response.message)
    }
  }
  catch (error) {
    showError('Error while saving voucher')
  }
  finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:open', false)
  resetForm()
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ editData ? 'Edit' : 'Create' }} Voucher</DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <!-- Voucher Code -->
          <div>
            <Label for="voucher_code">Voucher Code *</Label>
            <Input
              id="voucher_code"
              v-model="formData.voucher_code"
              placeholder="Ex: SUMMER2024"
              required
              class="uppercase"
            />
          </div>

          <!-- Voucher Name -->
          <div>
            <Label for="name">Voucher Name *</Label>
            <Input
              id="name"
              v-model="formData.name"
              placeholder="Ex: Summer promotion"
              required
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            v-model="formData.description"
            placeholder="Detailed description of the voucher..."
            rows="3"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Discount Type -->
          <div>
            <Label for="discount_type">Discount Type *</Label>
            <Select v-model="formData.discount_type">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  Percentage (%)
                </SelectItem>
                <SelectItem value="fixed">
                  Fixed (VND)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Discount Value -->
          <div>
            <Label for="discount_value">
              Discount Value * {{ formData.discount_type === 'percentage' ? '(%)' : '(VND)' }}
            </Label>
            <Input
              id="discount_value"
              v-model.number="formData.discount_value"
              type="number"
              min="0"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Giá trị đơn hàng tối thiểu -->
          <div>
            <Label for="min_purchase">Đơn hàng tối thiểu (VNĐ)</Label>
            <Input
              id="min_purchase"
              v-model.number="formData.min_purchase_amount"
              type="number"
              min="0"
            />
          </div>

          <!-- Giảm tối đa -->
          <div v-if="formData.discount_type === 'percentage'">
            <Label for="max_discount">Giảm tối đa (VNĐ)</Label>
            <Input
              id="max_discount"
              v-model.number="formData.max_discount_amount"
              type="number"
              min="0"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Giới hạn sử dụng -->
          <div>
            <Label for="usage_limit">Tổng số lượt sử dụng</Label>
            <Input
              id="usage_limit"
              v-model.number="formData.usage_limit"
              type="number"
              min="1"
              placeholder="Để trống = không giới hạn"
            />
          </div>

          <!-- Giới hạn mỗi khách -->
          <div>
            <Label for="usage_limit_customer">Lượt dùng/khách hàng</Label>
            <Input
              id="usage_limit_customer"
              v-model.number="formData.usage_limit_per_customer"
              type="number"
              min="1"
            />
          </div>
        </div>

        <div>
          <Label for="max_users">Số lượng khách hàng tối đa</Label>
          <Input
            id="max_users"
            v-model.number="formData.max_users"
            type="number"
            min="1"
            placeholder="Để trống = không giới hạn người dùng"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Ngày bắt đầu -->
          <div>
            <Label for="start_date">Ngày bắt đầu *</Label>
            <Input
              id="start_date"
              v-model="formData.start_date"
              type="date"
              required
            />
          </div>

          <!-- Ngày kết thúc -->
          <div>
            <Label for="end_date">Ngày kết thúc *</Label>
            <Input
              id="end_date"
              v-model="formData.end_date"
              type="date"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Áp dụng cho -->
          <div>
            <Label for="applicable_to">Áp dụng cho</Label>
            <Select v-model="formData.applicable_to">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Tất cả sản phẩm
                </SelectItem>
                <SelectItem value="medicine">
                  Thuốc cụ thể
                </SelectItem>
                <SelectItem value="category">
                  Danh mục cụ thể
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Trạng thái -->
          <div>
            <Label for="status">Trạng thái</Label>
            <Select v-model="formData.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  Kích hoạt
                </SelectItem>
                <SelectItem value="inactive">
                  Chưa kích hoạt
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            Hủy
          </Button>
          <Button type="submit" :disabled="loading">
            {{ loading ? 'Đang lưu...' : 'Lưu voucher' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
