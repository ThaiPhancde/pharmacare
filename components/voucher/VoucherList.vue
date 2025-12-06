<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'
import { useMessage } from '@/composables/useMessage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Voucher {
  _id: string
  voucher_code: string
  name: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  start_date: Date
  end_date: Date
  status: 'active' | 'inactive' | 'expired'
  usage_count: number
  usage_limit?: number
}

const vouchers = ref<Voucher[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

const { showSuccess, showError } = useMessage()

async function fetchVouchers() {
  loading.value = true
  try {
    const params: any = {}
    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await useApi('/api/voucher', {
      method: 'GET',
      params,
    })

    if (response.status) {
      vouchers.value = response.data
    }
    else {
      showError(response.message)
    }
  }
  catch (error) {
    showError('Lỗi khi tải danh sách voucher')
  }
  finally {
    loading.value = false
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-500'
    case 'inactive':
      return 'bg-yellow-500'
    case 'expired':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'active':
      return 'Đang hoạt động'
    case 'inactive':
      return 'Chưa kích hoạt'
    case 'expired':
      return 'Hết hạn'
    default:
      return status
  }
}

function formatDiscount(voucher: Voucher) {
  if (voucher.discount_type === 'percentage') {
    return `${voucher.discount_value}%`
  }
  return `${voucher.discount_value.toLocaleString('vi-VN')} VNĐ`
}

onMounted(() => {
  fetchVouchers()
})

defineExpose({
  fetchVouchers,
})
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex gap-4 items-end">
      <div class="flex-1">
        <label class="text-sm font-medium">Tìm kiếm</label>
        <Input
          v-model="searchQuery"
          placeholder="Tìm theo mã hoặc tên voucher..."
          @keyup.enter="fetchVouchers"
        />
      </div>
      <div class="w-48">
        <label class="text-sm font-medium">Trạng thái</label>
        <Select v-model="statusFilter" @update:model-value="fetchVouchers">
          <SelectTrigger>
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Tất cả
            </SelectItem>
            <SelectItem value="active">
              Đang hoạt động
            </SelectItem>
            <SelectItem value="inactive">
              Chưa kích hoạt
            </SelectItem>
            <SelectItem value="expired">
              Hết hạn
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button @click="fetchVouchers">
        <i class="i-lucide-search mr-2" />
        Tìm kiếm
      </Button>
    </div>

    <!-- Table -->
    <div class="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã Voucher</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Loại giảm giá</TableHead>
            <TableHead>Giá trị</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead>Sử dụng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead class="text-right">
              Hành động
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="8" class="text-center py-8">
              Đang tải...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="vouchers.length === 0">
            <TableCell colspan="8" class="text-center py-8">
              Không có voucher nào
            </TableCell>
          </TableRow>
          <TableRow v-for="voucher in vouchers" v-else :key="voucher._id">
            <TableCell class="font-mono font-bold">
              {{ voucher.voucher_code }}
            </TableCell>
            <TableCell>{{ voucher.name }}</TableCell>
            <TableCell>
              {{ voucher.discount_type === 'percentage' ? 'Phần trăm' : 'Cố định' }}
            </TableCell>
            <TableCell>{{ formatDiscount(voucher) }}</TableCell>
            <TableCell class="text-sm">
              <div>{{ new Date(voucher.start_date).toLocaleDateString('vi-VN') }}</div>
              <div class="text-muted-foreground">
                đến {{ new Date(voucher.end_date).toLocaleDateString('vi-VN') }}
              </div>
            </TableCell>
            <TableCell>
              {{ voucher.usage_count }}{{ voucher.usage_limit ? ` / ${voucher.usage_limit}` : '' }}
            </TableCell>
            <TableCell>
              <Badge :class="getStatusColor(voucher.status)">
                {{ getStatusText(voucher.status) }}
              </Badge>
            </TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="sm" @click="$emit('edit', voucher)">
                <i class="i-lucide-pencil" />
              </Button>
              <Button variant="ghost" size="sm" @click="$emit('delete', voucher._id)">
                <i class="i-lucide-trash-2" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
