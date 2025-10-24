<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const message = useMessage()

// Fetch services
const { data: services, pending, refresh } = await useApi('/api/service')

// Search and filter
const searchQuery = ref('')
const statusFilter = ref('all')
const categoryFilter = ref('all')

const filteredServices = computed(() => {
  if (!services.value?.data) return []
  
  let result = services.value.data
  
  if (statusFilter.value !== 'all') {
    result = result.filter((s: any) => s.status === statusFilter.value)
  }
  
  if (categoryFilter.value !== 'all') {
    result = result.filter((s: any) => s.category === categoryFilter.value)
  }
  
  if (searchQuery.value) {
    result = result.filter((s: any) => 
      s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.service_id.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return result
})

// Get unique categories
const categories = computed(() => {
  if (!services.value?.data) return []
  return [...new Set(services.value.data.map((s: any) => s.category))]
})

// Format currency
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">Quản Lý Dịch Vụ</h1>
        <p class="text-gray-600 mt-2">Danh sách dịch vụ y tế & tư vấn</p>
      </div>
      <NuxtLink
        to="/service/create"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <Icon name="lucide:plus" class="inline mr-2" />
        Thêm Dịch Vụ
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Tìm kiếm</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tên dịch vụ, mã..."
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Danh mục</label>
          <select
            v-model="categoryFilter"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tất cả</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Trạng thái</label>
          <select
            v-model="statusFilter"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Services Grid -->
    <div v-if="pending" class="p-8 text-center">
      <Icon name="lucide:loader-2" class="animate-spin text-4xl text-gray-400 mx-auto" />
      <p class="mt-2 text-gray-600">Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="!filteredServices.length" class="bg-white rounded-lg shadow p-8 text-center">
      <Icon name="lucide:stethoscope" class="text-6xl text-gray-300 mx-auto" />
      <p class="mt-4 text-gray-600">Không có dịch vụ nào</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="service in filteredServices"
        :key="service._id"
        class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-900">{{ service.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ service.service_id }}</p>
            </div>
            <span
              :class="{
                'bg-green-100 text-green-800': service.status === 'active',
                'bg-gray-100 text-gray-800': service.status === 'inactive',
              }"
              class="px-2 py-1 rounded-full text-xs font-semibold"
            >
              {{ service.status === 'active' ? 'Hoạt động' : 'Tạm ngưng' }}
            </span>
          </div>

          <div class="mb-4">
            <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {{ service.category }}
            </span>
          </div>

          <p class="text-gray-600 text-sm mb-4">{{ service.description }}</p>

          <div class="space-y-2 mb-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Thời gian:</span>
              <span class="font-medium">{{ service.duration }} phút</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Giá:</span>
              <span class="font-bold text-green-600">{{ formatCurrency(service.price) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Đặt lịch:</span>
              <span>{{ service.requires_appointment ? 'Bắt buộc' : 'Không cần' }}</span>
            </div>
          </div>

          <div class="flex gap-2 pt-4 border-t">
            <NuxtLink
              :to="`/service/${service._id}`"
              class="flex-1 px-3 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700 text-sm"
            >
              Xem chi tiết
            </NuxtLink>
            <NuxtLink
              :to="`/service/appointments?service=${service._id}`"
              class="flex-1 px-3 py-2 bg-green-600 text-white text-center rounded hover:bg-green-700 text-sm"
            >
              Đặt lịch
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
